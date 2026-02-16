# Task: gen-numtheory-reverse_number-2189 | Score: 100% | 2026-02-13T12:23:18.751214

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))