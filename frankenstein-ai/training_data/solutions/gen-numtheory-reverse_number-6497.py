# Task: gen-numtheory-reverse_number-6497 | Score: 100% | 2026-02-13T09:42:31.134177

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))