# Task: gen-encode-rle-8063 | Score: 100% | 2026-02-17T19:58:38.716047

def run_length_encoding(s):
    if not s:
        return ""

    encoded_string = ""
    count = 1
    for i in range(len(s)):
        if i + 1 < len(s) and s[i] == s[i + 1]:
            count += 1
        else:
            encoded_string += s[i] + str(count)
            count = 1
    return encoded_string

input_string = input()
print(run_length_encoding(input_string))