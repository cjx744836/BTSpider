(function() {
    var ipt = document.querySelector('input');
    ipt.addEventListener('keyup', function(e) {
        if(e.keyCode === 13) {
            if(ipt.value.trim().length > 0) {
                document.location = '/search?key=' + encodeURIComponent(ipt.value);
            }
        }
    });
    document.querySelector('button').addEventListener('click', function(e) {
        if(ipt.value.trim().length > 0) {
            document.location = '/search?key=' + encodeURIComponent(ipt.value);
        }
    });
})();