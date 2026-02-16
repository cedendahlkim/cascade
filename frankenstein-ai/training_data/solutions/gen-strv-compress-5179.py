# Task: gen-strv-compress-5179 | Score: 100% | 2026-02-12T19:46:42.277882

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

s = input()
print(rle(s))