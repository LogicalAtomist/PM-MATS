import { getDecimalLength, getDecimalPart, findLabel } from './utils.js'
import { romanize } from './utils.js'
import * as labels from './pm-chapter-labels.json'

/**
 * Represents a minimap visualization in an SVG element.
 * @class
 */
export class Minimap {
    /**
     * Creates a new Minimap.
     * @param {string} [svgSelector='pm-map'] - The selector for the SVG element.
     * @param {Object} data - The data to be visualized.
     * @param {Object} [options={}] - Additional options for the visualization.
     * @param {number} [options.xOffset=20] - The horizontal offset for the visualization.
     * @param {number} [options.yOffset=20] - The vertical offset for the visualization.
     * @param {number} [options.size=5] - The size of the nodes in the visualization.
     * @param {string} [options.fill='blue'] - The fill color for the nodes.
     * @param {number} [options.textFontSize=12] - The font size for the text labels.
     * @param {string} [options.textFill='black'] - The fill color for the text labels.
     * @param {string|null} [options.highlightedNumber=null] - The number of the node to be highlighted.
     * @property {boolean} mainMinimap - Indicates if this is the main minimap.
     * @property {Object} svg - The D3 selection of the SVG element.
     * @property {Object} data - The data to be visualized.
     * @property {number} xOffset - The horizontal offset for the visualization.
     * @property {number} yOffset - The vertical offset for the visualization.
     * @property {number} size - The size of the nodes in the visualization.
     * @property {string} fill - The fill color for the nodes.
     * @property {number} textFontSize - The font size for the text labels.
     * @property {string} textFill - The fill color for the text labels.
     * @property {string|null} highlightedNumber - The number of the node to be highlighted.
     * @property {Object} tooltip - The D3 selection of the tooltip element.
     * @property {Object} minimpTooltip - The D3 selection of the minimap tooltip element.
     */
    constructor(svgSelector = 'pm-map', data, options = {}) {
        this.mainMinimap = false
        if (svgSelector === '#main-minimap') {
            this.mainMinimap = true
        }
        this.svg = d3.select(svgSelector)
        this.data = data
        this.xOffset = options.xOffset || 20
        this.yOffset = options.yOffset || 20
        this.size = options.size || 5
        this.fill = options.fill || 'blue'
        this.textFontSize = options.textFontSize || 12
        this.textFill = options.textFill || 'black'
        this.highlightedNumber = options.highlightedNumber || null
        this.init()

        this.tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')

        this.minimpTooltip = d3.select('body')
            .append('div')
            .attr('class', 'minimp-tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
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
        this._drawChapterMarker(minX, minY)
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
                if (d.properties.number === this.highlightedNumber && this.mainMinimap) {
                    return 'yellow'
                }
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
            .attr('stroke', d => {
                if (d.properties.number === this.highlightedNumber) {
                    return '#000000'
                }
                return '#000000'
            })
            .attr('stroke-width', d => {
                if (d.properties.number === this.highlightedNumber) {
                    return 2
                }
                return 0
            })
    
        shapes.attr('cx', d => d.x - minX + this.xOffset)
            .attr('cy', d => d.y - minY + this.yOffset)
            .attr('r', d => {
                const decimalCount = getDecimalLength(d.properties.number)
                const radiusIncreaseFactor = 0
                return this.size + (decimalCount * radiusIncreaseFactor)
        })

        shapes.on('mouseenter', (event, d) => this._showMiniNum(event, d))
            .on('mouseleave', () => this._hideMiniNum())

        
            shapes.on('click', (event, d) => {
                console.log(`Clicked circle with data:`, d)
                let queryString = new URLSearchParams({ n: d.properties.number })
                let currentUrl = new URL(window.location.href)
                currentUrl.search = ''
                currentUrl.pathname = currentUrl.pathname.replace('map.html', '')
                for (let [key, value] of new URLSearchParams(window.location.search).entries()) {
                    if (key !== 'edition-2' && key !== 'n') { 
                        queryString.append(key, value)
                    }
                }  
                let newUrl = `${currentUrl.origin}${currentUrl.pathname}?${queryString.toString()}`
                window.open(newUrl, '_blank')
            })            
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
            .attr('cx', d => d.x - minX + this.xOffset - 15)
            .attr('cy', d => d.y - minY + this.yOffset - 15)
            .attr('r', 17)
            .attr('fill', 'transparent')
            .attr('stroke', 'black')
            .attr('stroke-width', 5)

        // Create text for special nodes
        const texts = this.svg.selectAll('.special-text')
            .data(specialNodes)
            .enter()
            .append('text')
            .attr('class', 'special-text')
            .attr('x', d => d.x - minX + this.xOffset - 15)
            .attr('y', d => d.y - minY + this.yOffset - 15)
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
            .style('opacity', .9)
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

    /**
     * Shows the minimap tooltip with the node number.
     * 
     * @private
     * @param {Event} event - The mouse event.
     * @param {Object} d - The data of the node.
     */
    _showMiniNum(event, d) {
        this.minimpTooltip.transition()
            .duration(200)
            .style('opacity', .9)
        this.minimpTooltip.html(`${d.properties.number}`)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px')
    }

    /**
     * Hides the minimap tooltip.
     * 
     * @private
     */
    _hideMiniNum() {
        this.minimpTooltip.transition()
            .duration(500)
            .style('opacity', 0)
    }
}
