import { ChevronDown, Check } from "lucide-react";
import { MODEL_OPTIONS } from "@/utils/models";
import { useState, useEffect, useRef } from "react";

interface ModelSelectorProps {
  options?: string[];
  onChange: (model: string) => void;
  initialModel?: string;
}

type DropdownPosition = 'left' | 'right';

const ModelSelector = ({ 
  options = MODEL_OPTIONS, 
  onChange, 
  initialModel 
}: ModelSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [selectedModel, setSelectedModel] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>('right');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Set initial model on client-side only
  useEffect(() => {
    setIsClient(true);
    
    const storedModel = localStorage.getItem("selectedModel");
    let modelToSet = options[0];
    
    if (initialModel && options.includes(initialModel)) {
      modelToSet = initialModel;
    } else if (storedModel && options.includes(storedModel)) {
      modelToSet = storedModel;
    }
    
    setSelectedModel(modelToSet);
    if (onChange) onChange(modelToSet);
  }, [initialModel, options, onChange]);

  // Update selectedModel when initialModel changes externally
  useEffect(() => {
    if (initialModel && initialModel !== selectedModel && options.includes(initialModel)) {
      setSelectedModel(initialModel);
    } else if (initialModel && !options.includes(initialModel)) {
      const defaultModel = options[0];
      setSelectedModel(defaultModel);
      if (onChange) onChange(defaultModel);
    }
  }, [initialModel, selectedModel, options, onChange]);

  const handleSelect = (model: string) => {
    setSelectedModel(model);
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedModel", model);
    }
    if (onChange) onChange(model);
    setIsOpen(false);
  };

  // Calculate position before opening the dropdown
  const toggleDropdown = () => {
    if (!isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      
      if (rect.right + 300 > viewportWidth) {
        setDropdownPosition('left');
      } else {
        setDropdownPosition('right');
      }
    }
    setIsOpen(!isOpen);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && event.target instanceof Node && 
          !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Don't render anything during SSR to prevent hydration mismatch
  if (!isClient) {
    return (
      <div className="flex items-center justify-end gap-2 rounded-lg p-2 w-full md:w-auto">
        <span className="text-black dark:text-white text-right">{initialModel || options[0]}</span>
        <ChevronDown className="w-5 h-5 text-black dark:text-white" />
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative w-full md:w-auto">
      <div
        onClick={toggleDropdown}
        className="flex items-center justify-end gap-2 cursor-pointer bg-transparent hover:bg-accent hover:text-accent-foreground
rounded-lg p-2 transition-colors"
      >
        <span className="text-black dark:text-white text-right">{selectedModel}</span>
        <ChevronDown
          className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""} text-black dark:text-white`}
        />
      </div>

      {isOpen && (
        <ul 
          className={`absolute z-50 mt-2 ${dropdownPosition === "left" ? "right-0" : "left-0"} w-full md:w-[300px] bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-[50vh] overflow-y-auto`}
        >
          {options.map((option) => (
            <li
              key={option}
              onClick={() => handleSelect(option)}
              className={`flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-accent hover:text-accent-foreground
 transition-colors gap-4 ${
                selectedModel === option ? "bg-transparent text-blue-600 dark:text-blue-400" : "text-black dark:text-white"
              }`}
            >
              <span>{option}</span>
              {selectedModel === option && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ModelSelector;
