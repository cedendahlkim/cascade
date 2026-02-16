# Task: gen-numtheory-reverse_number-3126 | Score: 100% | 2026-02-13T18:39:51.211410

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))