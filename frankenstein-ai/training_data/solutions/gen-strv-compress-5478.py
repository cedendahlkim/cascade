# Task: gen-strv-compress-5478 | Score: 100% | 2026-02-12T17:33:21.378973

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