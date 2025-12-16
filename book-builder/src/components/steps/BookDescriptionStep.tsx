'use client';

import { useState } from 'react';
import { useBookStore } from '@/store/useBookStore';
import { ArrowLeft, ArrowRight, User, BookOpen, FileText } from 'lucide-react';

export function BookDescriptionStep() {
  const {
    bookConfig,
    setBookTitle,
    setBookDescription,
    setBookAuthor,
    setCurrentStep,
  } = useBookStore();

  const [localTitle, setLocalTitle] = useState(bookConfig.title);
  const [localDescription, setLocalDescription] = useState(bookConfig.description);
  const [localAuthor, setLocalAuthor] = useState(bookConfig.author);

  const handleContinue = () => {
    setBookTitle(localTitle);
    setBookDescription(localDescription);
    setBookAuthor(localAuthor);
    setCurrentStep('toc-generation');
  };

  const handleBack = () => {
    setCurrentStep('ai-setup');
  };

  const canContinue = localTitle.trim() && localDescription.trim() && localAuthor.trim();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Book Details
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Tell us about your book. This information will be used to generate the structure
          and can be displayed on the book's homepage.
        </p>
      </div>

      {/* Book Title */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <BookOpen className="h-4 w-4" />
          Book Title
        </label>
        <input
          type="text"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          placeholder="e.g., Modern Python Development"
          className="
            block w-full px-4 py-3 border border-gray-300 dark:border-gray-600
            rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
            placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500
          "
        />
      </div>

      {/* Author */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <User className="h-4 w-4" />
          Author Name
        </label>
        <input
          type="text"
          value={localAuthor}
          onChange={(e) => setLocalAuthor(e.target.value)}
          placeholder="e.g., Jane Developer"
          className="
            block w-full px-4 py-3 border border-gray-300 dark:border-gray-600
            rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
            placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500
          "
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <FileText className="h-4 w-4" />
          Book Description
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Describe what your book covers. Be specific about topics, target audience,
          and what readers will learn. This helps AI generate better content.
        </p>
        <textarea
          value={localDescription}
          onChange={(e) => setLocalDescription(e.target.value)}
          placeholder={`e.g., A comprehensive guide to modern Python development practices. This book covers:
- Setting up professional development environments
- Writing clean, maintainable code
- Testing strategies and best practices
- Deployment and CI/CD pipelines

Target audience: Intermediate Python developers looking to level up their skills.`}
          rows={8}
          className="
            block w-full px-4 py-3 border border-gray-300 dark:border-gray-600
            rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
            placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500
            resize-none
          "
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
          {localDescription.length} characters
        </p>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
          Tips for a better book description:
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>• Be specific about the topics and technologies covered</li>
          <li>• Mention the target audience and their skill level</li>
          <li>• Include learning objectives or what readers will gain</li>
          <li>• Specify if it's hands-on, theoretical, or a mix</li>
          <li>• Note any prerequisites or assumed knowledge</li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleBack}
          className="
            flex items-center gap-2 px-6 py-3 rounded-lg font-semibold
            text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700
            transition-colors
          "
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-lg font-semibold
            transition-colors
            ${
              canContinue
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          Continue
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
