# Task: gen-numtheory-reverse_number-2317 | Score: 100% | 2026-02-13T16:48:10.662655

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))