# Task: gen-numtheory-reverse_number-8963 | Score: 100% | 2026-02-13T11:27:24.328870

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))