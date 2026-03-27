import { User, Bot, ThumbsUp, ThumbsDown, ShoppingBag, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import { visit } from 'unist-util-visit';

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    type?: 'text' | 'product' | 'suggestion' | 'error';
  };
  onProductSelect?: (productName: string) => void;
}

function remarkProductCardPlugin() {
  return (tree: any) => {
    visit(tree, ['containerDirective', 'code'], (node: any) => {
      if (node.type === 'containerDirective' && node.name === 'product-card') {
        node.data = node.data || {};
        node.data.hName = 'div';
        node.data.hProperties = { className: 'product-card-directive' };
      }

      if (
        node.type === 'code' &&
        node.lang === 'product-card' &&
        typeof node.value === 'string'
      ) {
        node.type = 'paragraph';
        node.children = [{ type: 'text', value: node.value }];
        node.data = {
          hName: 'div',
          hProperties: { className: 'product-card-directive' },
        };
      }
    });
  };
}

const ProductCardComponent: React.FC<{
  children: React.ReactNode;
  onProductSelect?: (productName: string) => void;
}> = ({ children, onProductSelect }) => {
  const content = String(children || '').trim();
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);

  let image = '';
  let name = '';
  let price = '';
  let originalPrice = '';
  let discount = '';
  let category = '';
  let rating = '';
  let badge = '';
  let description = '';

  let i = 0;

  if (lines[i]?.startsWith('![')) {
    const match = lines[i].match(/!\[.*?\]\((.*?)\)/);
    if (match) image = match[1];
    i++;
  }

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('**') && line.endsWith('**') && !line.includes(':')) {
      name = line.slice(2, -2).trim();
      i++;
      break;
    }
    i++;
  }

  for (; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('**Giá:**')) price = line.replace('**Giá:**', '').trim();
    if (line.startsWith('**Tên sản phẩm đầy đủ:**')) name = line.replace('**Tên sản phẩm đầy đủ:**', '').trim();
    if (line.includes('~~')) {
      const match = line.match(/~~(.*?)~~/);
      if (match) originalPrice = match[1];
    }
    if ((line.includes('+') || line.includes('-')) && !line.includes('~~')) {
      const parts = line.trim().split(' ');
      discount = parts[parts.length - 1];
    }
    if (line.startsWith('**Danh mục:**')) category = line.replace('**Danh mục:**', '').trim();
    if (line.startsWith('**Đánh giá:**')) rating = line.replace('**Đánh giá:**', '').trim();
    if (line.startsWith('**Badge:**')) badge = line.replace('**Badge:**', '').trim();
    if (!line.startsWith('**') && !line.startsWith('![') && line) {
      description = line;
    }
  }

  return (
    <div className="my-4">
      <button
        onClick={() => onProductSelect?.(name || 'sản phẩm này')}
        className="group flex w-full items-start gap-4 rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-purple-400 hover:shadow-md"
      >
        <div className="relative flex-shrink-0">
          <img
            src={image || '/placeholder.svg'}
            alt={name}
            className="h-24 w-24 rounded-xl object-cover"
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              const target = e.currentTarget;
              target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="%236d28d9"/><text x="48" y="60" font-size="28" fill="white" text-anchor="middle">${name.charAt(0) || 'S'}</text></svg>`;
            }}
          />
          {badge && (
            <span className="absolute -top-2 -right-2 z-10 rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
              {badge}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-purple-700">
            {name || 'Sản phẩm'}
          </h4>
          <p className="mt-1 text-sm text-gray-600">{category || 'Sản phẩm'}</p>

          <div className="mt-3 flex items-end justify-between">
            <div>
              <div className="text-xl font-bold text-purple-600">{price || 'Liên hệ'}</div>
              {(originalPrice || discount) && (
                <div className="mt-1 flex items-center gap-3 text-sm">
                  {originalPrice && <span className="text-gray-500 line-through">{originalPrice}</span>}
                  {discount && <span className="font-medium text-red-600">{discount}</span>}
                </div>
              )}
            </div>
            {rating && <div className="text-sm font-medium text-gray-600">{rating}</div>}
          </div>

          {description && <p className="mt-2 text-sm text-gray-700">{description}</p>}
        </div>

        <ShoppingBag className="h-5 w-5 flex-shrink-0 text-gray-400 transition-colors group-hover:text-purple-600" />
      </button>
    </div>
  );
};

export default function ChatMessage({ message, onProductSelect }: ChatMessageProps) {
  const isBot = message.sender === 'bot';
  const isError = message.type === 'error';

  const renderContent = () => {
    if (!isBot) {
      return <p className="whitespace-pre-wrap text-white leading-relaxed">{message.content}</p>;
    }

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkDirective, remarkProductCardPlugin]}
        components={{
          div: ({ className, children, ...props }) => {
            if ((className as string)?.includes('product-card-directive')) {
              return <ProductCardComponent onProductSelect={onProductSelect}>{children}</ProductCardComponent>;
            }
            return <div className={className} {...props}>{children}</div>;
          },
        }}
      >
        {message.content}
      </ReactMarkdown>
    );
  };

  return (
    <div className={`flex gap-3 ${isBot ? '' : 'flex-row-reverse'}`}>
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
          isError ? 'bg-red-100' : isBot ? 'bg-purple-100' : 'bg-blue-100'
        }`}
      >
        {isError ? (
          <AlertCircle className="h-4 w-4 text-red-600" />
        ) : isBot ? (
          <Bot className="h-4 w-4 text-purple-600" />
        ) : (
          <User className="h-4 w-4 text-blue-600" />
        )}
      </div>

      <div className={`flex flex-col ${isBot ? 'items-start' : 'items-end'} max-w-[75%]`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isError
              ? 'bg-red-50 text-red-800 border border-red-200 rounded-tl-none'
              : isBot
              ? 'bg-white border border-gray-200 shadow-sm rounded-tl-none'
              : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md rounded-tr-none'
          }`}
        >
          {renderContent()}
        </div>

        <div className="mt-1 flex items-center gap-4">
          <span className="text-xs text-gray-500">
            {format(new Date(message.timestamp), 'HH:mm')}
          </span>

          {isBot && !isError && (
            <div className="flex items-center gap-2">
              <button
                className="rounded p-1 hover:bg-gray-100 transition-colors"
                onClick={() => console.log('Like:', message.id)}
                aria-label="Thích"
              >
                <ThumbsUp className="h-3.5 w-3.5 text-gray-500 hover:text-green-600" />
              </button>
              <button
                className="rounded p-1 hover:bg-gray-100 transition-colors"
                onClick={() => console.log('Dislike:', message.id)}
                aria-label="Không thích"
              >
                <ThumbsDown className="h-3.5 w-3.5 text-gray-500 hover:text-red-600" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}