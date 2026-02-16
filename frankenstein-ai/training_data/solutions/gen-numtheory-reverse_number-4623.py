# Task: gen-numtheory-reverse_number-4623 | Score: 100% | 2026-02-13T21:27:50.277290

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))