# Task: gen-numtheory-reverse_number-5318 | Score: 100% | 2026-02-13T20:49:42.664452

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))