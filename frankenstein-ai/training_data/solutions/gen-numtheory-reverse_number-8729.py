# Task: gen-numtheory-reverse_number-8729 | Score: 100% | 2026-02-13T11:27:21.150738

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))