# Task: gen-ll-reverse_list-4083 | Score: 100% | 2026-02-13T11:45:30.300712

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))