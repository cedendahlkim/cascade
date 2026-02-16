# Task: gen-ll-reverse_list-5930 | Score: 100% | 2026-02-13T14:01:08.630396

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))