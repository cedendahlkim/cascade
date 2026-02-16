# Task: gen-strv-compress-4569 | Score: 100% | 2026-02-12T11:59:09.654416

def rle(s):
    if not s:
        return ""
    
    encoded_string = ""
    count = 1
    
    for i in range(len(s)):
        if i + 1 < len(s) and s[i] == s[i+1]:
            count += 1
        else:
            encoded_string += s[i] + str(count)
            count = 1
    
    return encoded_string

input_string = input()
print(rle(input_string))