# Task: gen-numtheory-reverse_number-1198 | Score: 100% | 2026-02-13T09:34:39.119127

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))