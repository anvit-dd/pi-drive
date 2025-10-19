import React from "react";
import {
	File,
	FileImage,
	FileText,
	FileAudio,
	FileVideo,
	FileArchive,
	FileCode,
	FileSpreadsheet,
	PresentationIcon,
	FileChartColumnIncreasing,
} from "lucide-react";

interface IconProps {
	size?: string | number;
	className?: string;
}

const createIconComponent = (IconComponent: React.ComponentType<IconProps>) => {
	const WrappedIcon: React.FC<IconProps> = (props) =>
		React.createElement(IconComponent, {
			size: "20",
			className: "text-[var(--gray-10)]",
			...props,
		});

	WrappedIcon.displayName = `Wrapped${
		IconComponent.displayName || IconComponent.name
	}`;
	return WrappedIcon;
};

export const fileIconMap: {
	[ext: string]: React.ComponentType<IconProps>;
} = {
	jpeg: createIconComponent(FileImage),
	jpg: createIconComponent(FileImage),
	png: createIconComponent(FileImage),
	gif: createIconComponent(FileImage),
	svg: createIconComponent(FileImage),

	pdf: createIconComponent(FileChartColumnIncreasing),
	doc: createIconComponent(FileText),
	docx: createIconComponent(FileText),
	txt: createIconComponent(FileText),

	xls: createIconComponent(FileSpreadsheet),
	xlsx: createIconComponent(FileSpreadsheet),
	csv: createIconComponent(FileSpreadsheet),

	ppt: createIconComponent(PresentationIcon),
	pptx: createIconComponent(PresentationIcon),

	js: createIconComponent(FileCode),
	ts: createIconComponent(FileCode),
	html: createIconComponent(FileCode),
	css: createIconComponent(FileCode),
	py: createIconComponent(FileCode),
	c: createIconComponent(FileCode),
	exe: createIconComponent(FileCode),

	zip: createIconComponent(FileArchive),
	rar: createIconComponent(FileArchive),
	tar: createIconComponent(FileArchive),

	mp4: createIconComponent(FileVideo),
	mov: createIconComponent(FileVideo),
	mkv: createIconComponent(FileVideo),

	mp3: createIconComponent(FileAudio),
	wav: createIconComponent(FileAudio),

	default: createIconComponent(File),
};
