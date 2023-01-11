async function make(){
    lines = [document.getElementById("theText").value.replaceAll('\n', ' ').replaceAll(/ {2,}/g, ' ')]

    canvasBox = document.getElementById('canvasBox')
    canvasBox.innerHTML = ''

    function Constraints(height, width, font_size) {
        this.height = mm_to_px(height)
        this.width = mm_to_px(width)
        this.font_size = mm_to_px(font_size)
        this.margin = this.font_size * 20 / 80
        this.space = mm_to_px(this.font_size * 0.05)
        this.line_height = mm_to_px(this.font_size * 0.14)
    
        this.relative_height = 100
        this.ratio = this.relative_height / this.height

        this.relative = (constraint) => (constraint * this.ratio)

        this.relative_width = this.width * this.ratio
        this.relative_font_size = this.font_size * this.ratio
        this.relative_margin = this.margin * this.ratio
        this.relative_space = this.space * this.ratio
        this.relative_line_height = this.line_height * this.ratio
    }

    constraints = new Constraints(
        document.getElementById('woodHeight').value,
        document.getElementById('woodWidth').value,
        document.getElementById('fontSize').value
    )

    const font = await opentype.load('./CoolKids-Demo Bold.ttf')

    for( var index_l = 0; index_l < lines.length; index_l++ )
    {
        line = lines[index_l]

        var canvas = document.createElement('canvas')
        canvas.height = constraints.relative_height
        canvas.width = constraints.relative_width
        canvas.id = "canvas" + index_l;

        br = document.createElement('br')
    
        canvasBox.appendChild(canvas)
    
        canvas = document.getElementById(canvas.id)

        words = line.split(' ')

        x_start = 0
        y_end = constraints.height - constraints.margin

        paths = []

        for( var index_w = 0; index_w < words.length; index_w++ )
        {
            word = words[index_w]
            var right_bound = repeating = 0, actual_path

            do {
                actual_path = font.getPath(word, x_start, y_end, constraints.font_size)
                
                var { x1: left_bound, x2: right_bound } = actual_path.getBoundingBox()

                if( repeating ) {
                    y_end -= constraints.line_height
                    x_start = 0
                }

                repeating = 1
            } while( right_bound > constraints.width && (right_bound - left_bound) < constraints.width )

            if( y_end - constraints.line_height < 0 ) {
                lines.push( words.slice(index_w).join(' ') )
                break;
            }

            var path = font.getPath(word, constraints.relative(x_start), constraints.relative(y_end), constraints.relative_font_size)

            path.draw(canvas.getContext("2d"))

            paths.push(font.getPath(word, x_start, y_end, constraints.font_size))

            x_start = right_bound + constraints.space
        }

        anchor = document.createElement('a')
        anchor.setAttribute('download', "Text-to-SVG Frame " + (index_l + 1) + ".svg")
        anchor.setAttribute('target', "_blank")

        anchor.setAttribute('href', "data:image/svg+sml;charset=utf-8," + encodeURIComponent(`<svg height='${constraints.height}' width='${constraints.width}' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${constraints.width} ${constraints.height}'>
                                            ${
                                                paths.map( path => `<path d="${union(path.toPathData())}" />` ).join(" ")
                                            }
                                            <style>
                                            path {
                                                stroke:#000000;
                                                stroke-opacity:1;
                                                fill:none;
                                            }
                                            </style>
                                        </svg>`))
        anchor.innerHTML = "Donload Frame " + (index_l + 1)

        canvasBox.appendChild(anchor)

        canvasBox.appendChild(br)
    }

    save_session()
}

var timeout = null
var n = 0

function makeIt() {
    clearTimeout(timeout)
    timeout = setTimeout( () => {
        console.log(++n)
        make()
    }, 500)
}

function mm_to_px(cm) {
    return cm * 3.77952755906;
}

function save_session() {
    sessionStorage.pageData = JSON.stringify({
        text: document.getElementById("theText").value,
        font_size: document.getElementById("fontSize").value,
        height: document.getElementById("woodHeight").value,
        width: document.getElementById("woodWidth").value
    })
}

if( sessionStorage.pageData == undefined ) {
    save_session()
}
else {
    pageData = JSON.parse(sessionStorage.pageData)
    document.getElementById("theText").value = pageData.text
    document.getElementById("fontSize").value = pageData.font_size
    document.getElementById("woodHeight").value = pageData.height
    document.getElementById("woodWidth").value = pageData.width
}

make()
