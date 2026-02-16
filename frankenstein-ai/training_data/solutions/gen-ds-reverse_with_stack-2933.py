# Task: gen-ds-reverse_with_stack-2933 | Score: 100% | 2026-02-13T18:35:01.563418

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))