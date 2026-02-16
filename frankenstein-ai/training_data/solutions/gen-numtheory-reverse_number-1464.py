# Task: gen-numtheory-reverse_number-1464 | Score: 100% | 2026-02-13T12:25:56.850234

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))