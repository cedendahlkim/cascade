# Task: gen-numtheory-reverse_number-3673 | Score: 100% | 2026-02-13T18:37:54.218626

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))