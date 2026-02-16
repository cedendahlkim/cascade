# Task: gen-ds-reverse_with_stack-8846 | Score: 100% | 2026-02-13T17:12:02.433738

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))