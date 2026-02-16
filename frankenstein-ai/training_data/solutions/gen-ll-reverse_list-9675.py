# Task: gen-ll-reverse_list-9675 | Score: 100% | 2026-02-14T12:47:34.154127

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))