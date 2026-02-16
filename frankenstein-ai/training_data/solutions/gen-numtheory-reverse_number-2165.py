# Task: gen-numtheory-reverse_number-2165 | Score: 100% | 2026-02-13T10:01:50.924319

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))