# Task: gen-numtheory-reverse_number-9560 | Score: 100% | 2026-02-14T12:14:10.455763

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))