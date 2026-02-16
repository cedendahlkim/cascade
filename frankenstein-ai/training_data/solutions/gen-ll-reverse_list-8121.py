# Task: gen-ll-reverse_list-8121 | Score: 100% | 2026-02-13T14:19:11.402949

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))