# Task: gen-ll-reverse_list-2937 | Score: 100% | 2026-02-15T08:13:43.565650

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))