const Hexo = require("hexo");
const hexo = new Hexo(process.cwd(), {debug:true});



hexo.init().then(function() {
    // ...
});

hexo.load().then(function() {
    // ...
});

hexo.watch().then(function() {
    // 之后可以调用 hexo.unwatch()，停止监视文件
});



hexo.call('clean');

hexo.call('generate', {}).then(function(){
  return hexo.exit();
}).catch(function(err){
  return hexo.exit(err);
});
