import { X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AIReportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onClear: () => void;
    reportContent: string | null;
}

export default function AIReportDialog({ isOpen, onClose, onClear, reportContent }: AIReportDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
                <div className="sticky top-0 bg-white border-b border-cyan-200 p-6 flex justify-between items-center gap-4 z-10">
                    <h2 className="text-2xl font-bold text-gray-800">Заключение ИИ</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClear}
                            className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 transition-all whitespace-nowrap"
                        >
                            Стереть
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>
                <div className="p-6 text-gray-700 text-sm leading-relaxed">
                    {reportContent ? (
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-gray-800 mt-6 mb-4" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-gray-800 mt-6 mb-3" {...props} />,
                                h3: ({ node, ...props }) => <h3 className="text-lg font-bold text-gray-800 mt-4 mb-2" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 mb-3" {...props} />,
                                ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1 mb-3" {...props} />,
                                li: ({ node, ...props }) => <li className="text-gray-700" {...props} />,
                                p: ({ node, ...props }) => <p className="mb-3 text-gray-700" {...props} />,
                                strong: ({ node, ...props }) => <strong className="font-bold text-gray-900" {...props} />,
                                table: ({ node, ...props }) => <div className="overflow-x-auto my-4"><table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg" {...props} /></div>,
                                thead: ({ node, ...props }) => <thead className="bg-gray-50" {...props} />,
                                tbody: ({ node, ...props }) => <tbody className="bg-white divide-y divide-gray-200" {...props} />,
                                tr: ({ node, ...props }) => <tr className="" {...props} />,
                                th: ({ node, ...props }) => <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b bg-gray-50" {...props} />,
                                td: ({ node, ...props }) => <td className="px-4 py-3 whitespace-normal text-sm text-gray-700 border-b" {...props} />,
                            }}
                        >
                            {reportContent}
                        </ReactMarkdown>
                    ) : "Отчет пуст"}
                </div>
            </div>
        </div>
    );
}
