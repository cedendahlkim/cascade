# Task: gen-numtheory-reverse_number-3130 | Score: 100% | 2026-02-13T12:04:11.434948

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))