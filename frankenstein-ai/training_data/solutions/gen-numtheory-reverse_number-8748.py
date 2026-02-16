# Task: gen-numtheory-reverse_number-8748 | Score: 100% | 2026-02-13T20:32:59.001306

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))