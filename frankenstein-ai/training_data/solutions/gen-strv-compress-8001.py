# Task: gen-strv-compress-8001 | Score: 100% | 2026-02-12T16:43:42.599720

def rle(s):
    if not s:
        return ""
    
    result = ""
    count = 1
    
    for i in range(len(s)):
        if i + 1 < len(s) and s[i] == s[i+1]:
            count += 1
        else:
            result += s[i] + str(count)
            count = 1
    
    return result

s = input()
print(rle(s))