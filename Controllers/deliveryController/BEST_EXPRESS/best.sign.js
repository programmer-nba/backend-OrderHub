const crypto = require('crypto');

doSign = async (formData, charset, keys)=>{
    let sign = '';
    const strBiz = JSON.stringify(formData.bizData)
    bizData = strBiz + keys;
    // console.log(bizData)
    try{
        const md = crypto.createHash('md5');
            md.update(Buffer.from(bizData, charset));
        const b = md.digest();
        
        const output = [];
        for (let i = 0; i < b.length; i++) {
            let temp = (b[i] & 0xff).toString(16);
                if (temp.length < 2) {
                    temp = '0' + temp;
                }
            output.push(temp);
        }
        sign = output.join('');
        formData.sign = sign
        formData.bizData = strBiz
        // console.log(formData)
        return formData
    }catch(err){
        throw new Error(err);
    }
}

module.exports = { doSign }