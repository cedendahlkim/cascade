# Task: gen-numtheory-reverse_number-4601 | Score: 100% | 2026-02-13T18:36:09.516798

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))