import { getDecimalLength, getDecimalPart } from './utils.js'
import * as labels from './pm-chapter-labels.json'
import { romanize, findLabel } from './utils.js'

/**
 * Draw Class to create a D3 visualization.
 * 
 * @class
 * @param {string} [svgSelector='pm-map'] - The CSS selector to attach the SVG element to.
 * @param {Object} data - The data to be visualized.
 * @param {Object} [options={}] - Additional options for customization.
 * @param {number} [options.xOffset=20] - X-offset for positioning elements.
 * @param {number} [options.yOffset=20] - Y-offset for positioning elements.
 * @param {string} [options.shape='circle'] - The shape to be drawn. Can be 'circle', 'rect', 'ellipse', or 'polygon'.
 * @param {number} [options.size=5] - The radius of circle or half rect width.
 * @param {string} [options.fill='blue'] - The fill color for shapes.
 * @param {number} [options.textFontSize=12] - The font size for text labels.
 * @param {string} [options.textFill='black'] - The fill color for text.
 */
export class Map {
    /**
     * Creates a new Map.
     * @param {string} [svgSelector='pm-map'] - The CSS selector to attach the SVG element to.
     * @param {Object} data - The data to be visualized.
     * @param {Object} [options={}] - Additional options for customization.
     * @param {number} [options.xOffset=20] - X-offset for positioning elements.
     * @param {number} [options.yOffset=20] - Y-offset for positioning elements.
     * @param {string} [options.shape='circle'] - The shape to be drawn. Can be 'circle', 'rect', 'ellipse', or 'polygon'.
     * @param {number} [options.size=5] - The radius of circle or half rect width.
     * @param {string} [options.fill='blue'] - The fill color for shapes.
     * @param {number} [options.textFontSize=12] - The font size for text labels.
     * @param {string} [options.textFill='black'] - The fill color for text.
     */
    constructor(svgSelector = 'pm-map', data, options = {}) {
        this.svg = d3.select(svgSelector)
        this.data = data
        this.xOffset = options.xOffset || 20
        this.yOffset = options.yOffset || 20
        this.size = options.size || 5
        this.fill = options.fill || 'blue'
        this.textFontSize = options.textFontSize || 12
        this.textFill = options.textFill || 'black'
        this.init()

        this.tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .attr('aria-hidden', 'true')
            .style('opacity', 0)
            .style('position', 'absolute')

        // SVG tooltip for displaying external SVG files
        this.svgTooltip = d3.select('body')
            .append('div')
            .attr('class', 'svg-tooltip')
            .attr('aria-hidden', 'true')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('pointer-events', 'none') // Ensures it doesn't interfere with mouse events
    }

    /**
     * Initializes the visualization by calculating dimensions and drawing elements.
     * 
     * @private
     */
    init() {
        // Calculate minimum and maximum x and y coordinates
        let minX = Infinity,
            maxX = -Infinity,
            minY = Infinity,
            maxY = -Infinity
        Object.keys(this.data).forEach(chapter => {
            this.data[chapter].forEach(d => {
                if (!d.properties.isPlaceholder) {
                    minX = Math.min(minX, d.x)
                    maxX = Math.max(maxX, d.x)
                    minY = Math.min(minY, d.y)
                    maxY = Math.max(maxY, d.y)
                }
            })
        })

        // Calculate SVG dimensions
        const svgWidth = maxX - minX + this.xOffset
        const svgHeight = maxY - minY + this.yOffset

        // Set SVG dimensions
        this.svg
            .attr('width', svgWidth)
            .attr('height', svgHeight)

        this._drawShape(minX, minY)
        this._drawTextLabels(minX, minY)
        this._drawChapterMarker(minX, minY)
        this._titles('2.0')
    }

    /**
     * Draws shapes on the SVG canvas.
     * 
     * @private
     * @param {number} minX - The minimum X-coordinate in the data.
     * @param {number} minY - The minimum Y-coordinate in the data.
     */
    _drawShape(minX, minY) {
        const defs = this.svg.append('defs')
        const ppnt = defs.append('linearGradient')
            .attr('id', 'ppnt')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '100%')
        ppnt.append('stop').attr('offset', '50%').attr('stop-color', '#f005e0')
        ppnt.append('stop').attr('offset', '50%').attr('stop-color', 'black')

        const dft = defs.append('linearGradient')
            .attr('id', 'dft')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '100%')
        dft.append('stop').attr('offset', '50%').attr('stop-color', '#05e0f0')
        dft.append('stop').attr('offset', '50%').attr('stop-color', 'black')

        const thmnt = defs.append('linearGradient')
            .attr('id', 'thmnt')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '100%')
        thmnt.append('stop').attr('offset', '50%').attr('stop-color', '#cc5500')
        thmnt.append('stop').attr('offset', '50%').attr('stop-color', 'black')

        const shapes = this.svg.selectAll('circle')
            .data(Object.values(this.data).flat())
            .enter()
            .append('circle')
            .filter(d => !d.properties.isPlaceholder)
            .attr('fill', d => {
                if (d.properties.type) {
                    switch (d.properties.type) {
                        case 'Thm':
                            return this.fill
                        case 'Pp':
                            return '#f005e0'
                        case 'Df':
                            return '#05e0f0'
                        case 'Pp(nt)':
                            return 'url(#ppnt)'
                        case 'Dft':
                            return 'url(#dft)'
                        case 'Thm(nt)':
                            return 'url(#thmnt)'
                        default:
                            return this.fill
                    }
                }
                return this.fill
            })

        shapes.attr('cx', d => d.x - minX + this.xOffset)
            .attr('cy', d => d.y - minY + this.yOffset)
            .attr('r', d => {
                const decimalCount = getDecimalLength(d.properties.number)
                const radiusIncreaseFactor = 0
                return this.size + (decimalCount * radiusIncreaseFactor)
            })

        shapes.on('click', (event, d) => {
            console.log(`Clicked circle with data:`, d)
            let queryString = new URLSearchParams({ n: d.properties.number })
            let currentUrl = new URL(window.location.href)

            // Remove 'edition-2' if present
            queryString.delete('edition-2')

            // Add the rest of the current parameters to the query string
            for (let [key, value] of currentUrl.searchParams.entries()) {
                if (key !== 'edition-2') {
                    queryString.append(key, value)
                }
            }

            // Open new URL with the updated query string
            let newUrl = `${currentUrl.origin}${currentUrl.pathname}?${queryString.toString()}`
            window.open(newUrl, '_blank')
        })
        // Add mouseenter and mouseleave event listeners
        .on('mouseenter', (event, d) => this._showSvgTooltip(event, d))
        .on('mouseleave', () => this._hideSvgTooltip())
    }

    /**
     * Shows the SVG tooltip when hovering over a shape.
     * 
     * @private
     * @param {Event} event - The mouse event.
     * @param {Object} d - The data of the node.
     */
    _showSvgTooltip(event, d) {
        const number = d.properties.number
        const fileName = `./svgs/${number}.svg`

        d3.xml(fileName).then(data => {
            // Remove any existing content
            this.svgTooltip.selectAll('*').remove()

            // Append the loaded SVG to the svgTooltip div
            this.svgTooltip.node().appendChild(data.documentElement)

            // Show the tooltip
            this.svgTooltip.transition()
                .duration(200)
                .style('opacity', 1)

            // Position the tooltip near the mouse
            this.svgTooltip
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px')
        }).catch(error => {
            console.error(`Error loading SVG file ${fileName}:`, error)
        })
    }

    /**
     * Hides the SVG tooltip.
     * 
     * @private
     */
    _hideSvgTooltip() {
        this.svgTooltip.transition()
            .duration(500)
            .style('opacity', 0)
    }

    /**
     * Draws text labels on the SVG canvas.
     * 
     * @private
     * @param {number} minX - The minimum X-coordinate in the data.
     * @param {number} minY - The minimum Y-coordinate in the data.
     */
    _drawTextLabels(minX, minY) {
        this.svg.selectAll('text')
            .data(Object.values(this.data).flat())
            .enter()
            .append('text')
            .filter(d => !d.properties.isPlaceholder)
            .attr('x', d => d.x - minX + this.xOffset)
            .attr('y', d => d.y - minY - 10 + this.yOffset)
            .text(d => d.properties.number)
            .attr('text-anchor', 'middle')
            .attr('font-size', this.textFontSize)
            .attr('fill', this.textFill)
            .attr('font-family', 'EB Garamond, serif')
    }

    /**
     * Draws the special circle with an asterisk and number inside.
     * 
     * @private
     * @param {number} minX - The minimum X-coordinate in the data.
     * @param {number} minY - The minimum Y-coordinate in the data.
     */
    _drawChapterMarker(minX, minY) {
        const specialNodes = Object.values(this.data).flat().filter(d => {
            const decimalPart = getDecimalPart(d.properties.number)
            if (decimalPart) {
                return decimalPart === '0'
            }
            return false
        })

        // Create circles for special nodes
        const circles = this.svg.selectAll('.special-circle')
            .data(specialNodes)
            .enter()
            .append('circle')
            .attr('class', 'special-circle')
            .attr('cx', d => d.x - minX + this.xOffset)
            .attr('cy', d => d.y - minY + this.yOffset)
            .attr('r', 17)
            .attr('fill', 'transparent')
            .attr('stroke', 'black')
            .attr('stroke-width', 5)
            .attr('tabindex', '0')
            .attr('focusable', 'true')
            .attr('role', 'link')
            .attr('aria-label', d => 
                `Starred number ${d.properties.number}, type ${d.properties.type}. Opens mini-map in new tab.`
            );

            // Function to open mini-map in a new tab
            function openMiniMap(d) {
            // Create query parameters
                const params = new URLSearchParams();
                params.set('n', d.properties.number);

            // Preserve existing query parameters (except 'edition-2' and 'n')
            for (const [key, value] of new URLSearchParams(window.location.search)) {
                if (!['edition-2', 'n'].includes(key)) {
                params.set(key, value);
                }
            }

            // ✅ Explicitly open minimap.html in a new tab with query string
            const newUrl = `minimap.html?${params.toString()}`;
                window.open(newUrl, '_blank');
            }

            // Keyboard activation: Enter or Space triggers openMiniMap
            circles.on('keydown', (event, d) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault(); // Prevents page scroll or unwanted link behavior
                openMiniMap(d);
            }
            });

            // Mouse activation: clicking a circle also opens minimap
            circles.on('click', (event, d) => {
                openMiniMap(d);
            });


        // Create text for special nodes
        const texts = this.svg.selectAll('.special-text')
            .data(specialNodes)
            .enter()
            .append('text')
            .attr('class', 'special-text')
            .attr('x', d => d.x - minX + this.xOffset)
            .attr('y', d => d.y - minY + this.yOffset)
            .attr('font-family', 'EB Garamond, serif')
            .attr('font-size', '12px')
            .attr('fill', 'black')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')

        // Create tspans for the ❋ character
        texts.append('tspan')
            .text('❋')

        // Create tspans for the node's number
        texts.append('tspan')
            .attr('dx', '-1')
            .text(d => d.properties.number.split('.')[0])

        circles.on('mouseenter', (event, d) => this._showTooltip(event, d))
            .on('mouseleave', () => this._hideTooltip())

        texts.on('mouseenter', (event, d) => this._showTooltip(event, d))
            .on('mouseleave', () => this._hideTooltip())
    }

    /**
     * Finds the titles for a given chapter number.
     * 
     * @private
     * @param {string} chapterNumber - The chapter number to find titles for.
     * @returns {Object} The titles for the chapter.
     */
    _titles(chapterNumber) {
        let title = findLabel(chapterNumber, this.data, labels)
        return title
    }

    /**
     * Shows the tooltip with information about the node.
     * 
     * @private
     * @param {Event} event - The mouse event.
     * @param {Object} d - The data of the node.
     */
    _showTooltip(event, d) {
        this.tooltip.transition()
            .duration(200)
            .style('opacity', 0.9)
        this.tooltip.html(`Volume ${romanize(d.properties.volume)}<br>Part ${romanize(d.properties.part)}: ${findLabel(d.properties.number, this.data, labels)['part-label']}<br>Section ${d.properties.section}: ${findLabel(d.properties.number, this.data, labels)['sect-label']}<br>Chapter ${d.properties.chapter}: ${findLabel(d.properties.number, this.data, labels)['chap-label']}`)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px')
    }

    /**
     * Hides the tooltip.
     * 
     * @private
     */
    _hideTooltip() {
        this.tooltip.transition()
            .duration(500)
            .style('opacity', 0)
    }
}
