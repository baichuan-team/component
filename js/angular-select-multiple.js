
angular.module('selectMultiple', [])
    .directive('selectMultipleItem', [function() {
        return {
            scope: true,
            restrict: 'A',
            link: function(scope, element, attrs, controller) {

                scope.isSelectable = true;
                scope.isSelecting = false;
                scope.isSelected = false;

                element.addClass('can-be-selected');
            }
        };
    }])
    .directive('selectMultipleBox', ['$document', '$timeout', function($document, $timeout) {
        return {
            scope: {
                    selectedDone:'&',
                    multipleSelect:'@'
                },
            restrict: 'A',
            link: function(scope, element, attrs, controller) {
                
                scope.isSelectableZone = true;

                var startX = 0;
                var startY = 0;
                var section;
                
                // 绑定mousedown事件
                element.on('mousedown', function(event) {
                    event.preventDefault();
                    event.stopPropagation();

                    startX = event.pageX;
                    startY = event.pageY;

                    // 插入选中框
                    section = angular
                        .element("<div></div>")
                        .css({
                            'position': 'absolute',
                            'border': '1px dashed red',
                            'opacity': '.2',
                            'backgroundColor': 'red'
                        });
                    
                    if (scope.multipleSelect === undefined){
                        scope.multipleSelect = 'true';
                    }
                    if (scope.multipleSelect === 'true'){
                        $document.find('body').eq(0).append(section);
                        $document.on('mousemove', mousemove);
                    }
                    // 绑定事件
                   
                    $document.on('mouseup', mouseup);
                });

                // mousemove事件
                function mousemove(event) {
                    event.preventDefault();
                    event.stopPropagation();

                    moveSelection(section, startX, startY, event.pageX, event.pageY);

                    var childs = getElements(element);

                    for (var i = 0; i < childs.length; i++) {
                        var child = childs[i];
                        var boxElement = transformPos(
                                                getPos(child[0]).left,
                                                getPos(child[0]).top,
                                                getPos(child[0]).left + child.prop('offsetWidth'),
                                                getPos(child[0]).top + child.prop('offsetHeight')
                                            );
                        var boxSection = transformPos(startX, startY, event.pageX, event.pageY);

                        if (checkSelectedElement(boxElement, boxSection)){
                            if (child.scope().isSelecting === false){
                                child.scope().isSelecting = true;
                            }
                        } else {
                            if (child.scope().isSelecting === true){
                                child.scope().isSelecting = false;
                            }
                        }

                        child.scope().$apply();

                    }

                }

                // mouseup事件
                function mouseup(event) {
                    event.preventDefault();
                    event.stopPropagation();
                    // 选择单个元素
                    var currentElement = event.srcElement || event.target;
                    if (
                            /can-be-selected/.test(currentElement.className)
                            && section[0].offsetHeight<3 
                            && section[0].offsetWidth<3 
                        ) {
                        section.remove();
                        var child = angular.element(currentElement);
                        var status = child.scope().isSelected;
                        if (status || child[0].className.match(' selected')){
                            child.scope().isSelected = false;
                        } else {
                            child.scope().isSelected = true;
                        }
                        child.scope().$apply();

                        // 框选多个元素
                    } else{
                        section.remove();

                        var childs = getElements(element);

                        for (var i = 0; i < childs.length; i++) {
                            var child = childs[i];
                            if (child.scope().isSelecting === true){
                                child.scope().isSelecting =false;
                                if(event.shiftKey) {
                                    child.scope().isSelected = false;
                                }else{
                                    child.scope().isSelected = true;
                                }
                                child.scope().$apply();
                            } else {
                                var boxElement = transformPos(
                                                        getPos(child[0]).left,
                                                        getPos(child[0]).top,
                                                        getPos(child[0]).left + child.prop('offsetWidth'),
                                                        getPos(child[0]).top + child.prop('offsetHeight')
                                                    );
                                var boxSection = transformPos(startX, startY, event.pageX, event.pageY);

                                if (checkSelectedElement(boxElement, boxSection)){
                                    if (child.scope().isSelected === false){
                                        child.scope().isSelected = true;
                                        child.scope().$apply();
                                    }
                                }
                            }
                            

                        }

                    }
                    // 解绑事件
                    $document.off('mousemove', mousemove);
                    $document.off('mouseup', mouseup);

                    // 回调函数
                    scope.selectedDone && scope.selectedDone();
                }


                /**
                 * 判断是否选中元素
                 * @param  {Object} boxElement元素本身
                 * @param  {Object} boxSection选中的区域
                 * @return {Boolean} true为选中, false为未选中
                 */
                function checkSelectedElement(boxElement, boxSection) {
                    return (boxSection.beginX <= boxElement.beginX && boxElement.beginX <= boxSection.endX || boxElement.beginX <= boxSection.beginX && boxSection.beginX <= boxElement.endX) &&
                        (boxSection.beginY <= boxElement.beginY && boxElement.beginY <= boxSection.endY || boxElement.beginY <= boxSection.beginY && boxSection.beginY <= boxElement.endY);
                }

                /**
                 *
                 *  转换起始XY值
                 *  beginX 始终小于 endX
                 *  beginY 始终小于 endY
                 * @param  {Number} startX
                 * @param  {Number} startY
                 * @param  {Number} endX
                 * @param  {Number} endY
                 * @return {Object} obj.beginX, obj.beginY, obj.endX, obj.endY
                 */
                function transformPos(startX, startY, endX, endY) {

                    var result = {};

                    if (startX > endX) {
                        result.beginX = endX;
                        result.endX = startX;
                    } else {
                        result.beginX = startX;
                        result.endX = endX;
                    }
                    if (startY > endY) {
                        result.beginY = endY;
                        result.endY = startY;
                    } else {
                        result.beginY = startY;
                        result.endY = endY;
                    }
                    return result;
                }

                /**
                 * 绘制选中区域
                 * @param  {Element} section
                 * @param  {Number} startX
                 * @param  {Number} startY
                 * @param  {Number} endX
                 * @param  {Number} endY
                 */
                function moveSelection(section, startX, startY, endX, endY) {

                    var box = transformPos(startX, startY, endX, endY);

                    section.css({
                        "top": box.beginY + "px",
                        "left": box.beginX + "px",
                        "width": (box.endX - box.beginX) + "px",
                        "height": (box.endY - box.beginY) + "px"
                    });
                }

                /**
                 * 获取能被选中的子元素
                 * @param  {Element} boxElement
                 * @return {Array} angular.element()包装过的数组对象
                 */
                function getElements(element) {
                    // 存储能被选中的元素
                    var selectableElements = [];

                    var childs = element[0].getElementsByClassName('can-be-selected');

                    for (var i=0; i<childs.length; i++){
                        var child = angular.element(childs[i]);
                        if (child.scope().isSelectable) {
                            selectableElements.push(child);
                        }
                    }

                    return selectableElements;
                }
                /**
                 * 获取元素的top, left值
                 * @param  {Element} element
                 * @return {Object} element.top, element.left
                 */
                function getPos(element) {
                    var box = {
                                top: 0,
                                left: 0
                    };
                    var doc = element && element.ownerDocument;

                    var documentElem = doc.documentElement;

                    if (typeof element.getBoundingClientRect !== undefined) {
                        box = element.getBoundingClientRect();
                    }

                    return {
                        top: box.top + (window.pageYOffset || documentElem.scrollTop) - (documentElem.clientTop || 0),
                        left: box.left + (window.pageXOffset || documentElem.scrollLeft) - (documentElem.clientLeft || 0)
                    };
                }

                // 支持选择整行或整列
                $timeout(function(){
                    clickEle('row');
                    clickEle('column');
                });
                /**
                 * 获取能点击元素
                 * @param  {String} row, column
                 * @return {type}
                 */
                function clickEle(type){
                    var type = type; 
                    var results = []; 
                    var childs = element[0].getElementsByTagName('*');

                    for (var i = childs.length - 1; i >= 0; i--) {
                        var child = childs[i]; 
                        child.index = i;
                        if (child.getAttribute('multiple-'+type)) {
                            results.push(child);
                        }

                    };

                    angular.forEach(results, function(item){
                        item.status = false;
                        var name = item.getAttribute('multiple-'+type);
                        angular.element(item).on('mousedown', function(event){
                            event.stopPropagation();

                            if (!item.status){
                                item.status = true;
                            }else{
                                 item.status = false;
                            }
                            changeStatus(item.status, name);
                        });
                    });
                    /**
                     * @param  {Boolean}
                     * @param  {String}
                     */
                    function changeStatus(status, name){
                        var out = [];
                        for (var i = childs.length - 1; i >= 0; i--) {
                            var child = childs[i];
                            if(child.getAttribute('multiple-'+type+'-data') === name){
                               angular.element(child).scope().isSelected = true;

                                if(status){
                                    angular.element(child).scope().isSelected = true;
                                }else{
                                    angular.element(child).scope().isSelected = false;
                                }
                                angular.element(child).scope().$apply();
                                // 回调函数
                                scope.selectedDone && scope.selectedDone();
                            }
                        };
                    }

                }

            }
        };
    }]);
