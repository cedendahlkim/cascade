# Task: gen-ds-reverse_with_stack-2356 | Score: 100% | 2026-02-12T17:35:08.705346

n = int(input())
linked_list = []
for _ in range(n):
  linked_list.append(int(input()))

linked_list.reverse()
print(*linked_list)