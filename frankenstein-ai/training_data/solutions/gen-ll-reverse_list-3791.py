# Task: gen-ll-reverse_list-3791 | Score: 100% | 2026-02-13T14:56:28.902958

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))