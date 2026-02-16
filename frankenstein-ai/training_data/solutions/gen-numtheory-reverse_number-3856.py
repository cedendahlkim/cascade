# Task: gen-numtheory-reverse_number-3856 | Score: 100% | 2026-02-13T13:10:56.113277

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))