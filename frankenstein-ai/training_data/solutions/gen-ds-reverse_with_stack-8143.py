# Task: gen-ds-reverse_with_stack-8143 | Score: 100% | 2026-02-13T17:35:56.917205

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))