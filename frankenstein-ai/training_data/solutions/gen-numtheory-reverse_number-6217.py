# Task: gen-numtheory-reverse_number-6217 | Score: 100% | 2026-02-13T14:18:47.966805

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))