# Task: gen-numtheory-reverse_number-3155 | Score: 100% | 2026-02-14T12:37:24.485467

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))