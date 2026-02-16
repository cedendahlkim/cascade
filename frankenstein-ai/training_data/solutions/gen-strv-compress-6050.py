# Task: gen-strv-compress-6050 | Score: 100% | 2026-02-12T12:16:59.772642

def rle(s):
    if not s:
        return ""
    
    result = ""
    count = 1
    
    for i in range(1, len(s)):
        if s[i] == s[i-1]:
            count += 1
        else:
            result += s[i-1] + str(count)
            count = 1
    
    result += s[-1] + str(count)
    return result

s = input()
print(rle(s))