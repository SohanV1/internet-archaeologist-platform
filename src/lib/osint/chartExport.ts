/**
 * High-resolution PNG and SVG chart export utility using html2canvas and native SVG serialization.
 */

import html2canvas from 'html2canvas';

export async function exportElementAsPng(elementId: string, filename: string): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Export target element #${elementId} not found in DOM`);
    return false;
  }

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#020617', // slate-950 background
      scale: 2, // 2x retina clarity
      useCORS: true,
      logging: false,
    });

    const dataUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = dataUrl;
    downloadLink.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    return true;
  } catch (err) {
    console.error('Failed to export chart as PNG:', err);
    return false;
  }
}

export function exportElementAsSvg(elementId: string, filename: string): boolean {
  const element = document.getElementById(elementId);
  if (!element) return false;

  const svgElement =
    element.tagName.toLowerCase() === 'svg' ? element : element.querySelector('svg');

  if (!svgElement) {
    console.error(`No SVG child found in #${elementId}`);
    return false;
  }

  try {
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);

    // Add XML namespaces if absent
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!source.match(/^<svg[^>]+xmlns:xlink="http:\/\/www\.w3\.org\/1999\/xlink"/)) {
      source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Failed to export SVG:', err);
    return false;
  }
}
