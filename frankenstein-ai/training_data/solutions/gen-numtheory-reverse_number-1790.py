# Task: gen-numtheory-reverse_number-1790 | Score: 100% | 2026-02-13T12:44:05.658487

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))