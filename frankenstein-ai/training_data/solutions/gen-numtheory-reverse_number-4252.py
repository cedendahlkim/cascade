# Task: gen-numtheory-reverse_number-4252 | Score: 100% | 2026-02-14T12:20:51.753782

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))