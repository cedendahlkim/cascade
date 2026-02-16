# Task: gen-numtheory-reverse_number-7982 | Score: 100% | 2026-02-15T08:06:05.869068

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))