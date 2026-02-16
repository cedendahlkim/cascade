# Task: gen-ds-reverse_with_stack-4314 | Score: 100% | 2026-02-13T18:00:27.068561

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))