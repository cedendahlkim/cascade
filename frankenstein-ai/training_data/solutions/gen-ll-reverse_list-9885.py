# Task: gen-ll-reverse_list-9885 | Score: 100% | 2026-02-13T14:09:14.703887

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))